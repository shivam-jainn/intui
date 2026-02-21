package consumer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type ExecutionRequest struct {
	JobID        string `json:"jobId"`
	QuestionName string `json:"questionName"`
	UserCode     string `json:"userCode"`
	Language     string `json:"language"`
	IsSubmission bool   `json:"isSubmission"`
	UserID       string `json:"userId,omitempty"`
	WebhookURL   string `json:"webhookUrl,omitempty"`
	WebhookToken string `json:"webhookToken,omitempty"`
	EnqueuedAt   string `json:"enqueuedAt,omitempty"`
}

type ExecutionResult struct {
	JobID        string          `json:"jobId"`
	QuestionName string          `json:"questionName"`
	Status       string          `json:"status"`
	Language     string          `json:"language,omitempty"`
	UserCode     string          `json:"userCode,omitempty"`
	IsSubmission bool            `json:"isSubmission"`
	UserID       string          `json:"userId,omitempty"`
	Result       json.RawMessage `json:"result,omitempty"`
	Error        string          `json:"error,omitempty"`
	CompletedAt  string          `json:"completedAt"`
}

func Start() error {
	rabbitURLs := rabbitURLCandidates()

	requestQueue := os.Getenv("EXECUTION_QUEUE_NAME")
	if requestQueue == "" {
		requestQueue = "execution_requests"
	}

	resultQueue := os.Getenv("EXECUTION_RESULT_QUEUE_NAME")
	if resultQueue == "" {
		resultQueue = "execution_results"
	}

	executorURL := os.Getenv("EXECUTOR_URL")
	if executorURL == "" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		executorURL = fmt.Sprintf("http://127.0.0.1:%s/execute", port)
	}

	for {
		if err := runConsumer(rabbitURLs, requestQueue, resultQueue, executorURL); err != nil {
			log.Printf("consumer stopped: %v; retrying in 5s", err)
			time.Sleep(5 * time.Second)
			continue
		}

		return nil
	}
}

func rabbitURLCandidates() []string {
	seen := map[string]struct{}{}
	urls := make([]string, 0, 5)

	addURL := func(url string) {
		if url == "" {
			return
		}
		if _, exists := seen[url]; exists {
			return
		}
		seen[url] = struct{}{}
		urls = append(urls, url)
	}

	addURL(os.Getenv("RABBITMQ_URL"))
	addURL("amqp://rabbit:rabbit@rabbitmq:5672/")
	addURL("amqp://rabbit:rabbit@host.docker.internal:5672/")
	addURL("amqp://rabbit:rabbit@127.0.0.1:5672/")
	addURL("amqp://guest:guest@127.0.0.1:5672/")

	return urls
}

func runConsumer(rabbitURLs []string, requestQueue, resultQueue, executorURL string) error {
	var conn *amqp.Connection
	var err error
	selectedURL := ""
	lastErr := ""

	for _, rabbitURL := range rabbitURLs {
		conn, err = amqp.Dial(rabbitURL)
		if err == nil {
			selectedURL = rabbitURL
			break
		}
		lastErr = err.Error()
	}

	if conn == nil {
		return fmt.Errorf("dial rabbitmq failed for all configured urls: %s", lastErr)
	}
	defer conn.Close()

	log.Printf("consumer connected to rabbitmq: %s", selectedURL)

	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("create channel: %w", err)
	}
	defer ch.Close()

	if _, err = ch.QueueDeclare(requestQueue, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare request queue: %w", err)
	}

	if _, err = ch.QueueDeclare(resultQueue, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare result queue: %w", err)
	}

	if err = ch.Qos(1, 0, false); err != nil {
		return fmt.Errorf("set qos: %w", err)
	}

	msgs, err := ch.Consume(requestQueue, "", false, false, false, false, nil)
	if err != nil {
		return fmt.Errorf("consume queue: %w", err)
	}

	log.Printf("consumer listening on queue=%s, publishing results to queue=%s", requestQueue, resultQueue)

	for msg := range msgs {
		var req ExecutionRequest
		if err := json.Unmarshal(msg.Body, &req); err != nil {
			_ = msg.Ack(false)
			continue
		}

		result := executeViaHTTP(executorURL, req)
		body, err := json.Marshal(result)
		if err != nil {
			_ = msg.Nack(false, true)
			continue
		}

		if err := ch.Publish("", resultQueue, false, false, amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		}); err != nil {
			_ = msg.Nack(false, true)
			continue
		}

		if req.WebhookURL != "" {
			if err := postResultToWebhook(req.WebhookURL, req.WebhookToken, body); err != nil {
				log.Printf("webhook delivery failed for job=%s: %v", req.JobID, err)
				_ = msg.Nack(false, true)
				continue
			}
		}

		_ = msg.Ack(false)
	}

	return fmt.Errorf("message stream closed")
}

func postResultToWebhook(webhookURL, webhookToken string, body []byte) error {
	req, err := http.NewRequest(http.MethodPost, webhookURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create webhook request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if webhookToken != "" {
		req.Header.Set("x-webhook-token", webhookToken)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("call webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("webhook returned status=%d body=%s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

func executeViaHTTP(executorURL string, req ExecutionRequest) ExecutionResult {
	payload, err := json.Marshal(req)
	if err != nil {
		return ExecutionResult{
			JobID:        req.JobID,
			QuestionName: req.QuestionName,
			Status:       "failed",
			Language:     req.Language,
			UserCode:     req.UserCode,
			IsSubmission: req.IsSubmission,
			UserID:       req.UserID,
			Error:        fmt.Sprintf("marshal request: %v", err),
			CompletedAt:  time.Now().UTC().Format(time.RFC3339),
		}
	}

	httpReq, err := http.NewRequest(http.MethodPost, executorURL, bytes.NewReader(payload))
	if err != nil {
		return ExecutionResult{
			JobID:        req.JobID,
			QuestionName: req.QuestionName,
			Status:       "failed",
			Language:     req.Language,
			UserCode:     req.UserCode,
			IsSubmission: req.IsSubmission,
			UserID:       req.UserID,
			Error:        fmt.Sprintf("create request: %v", err),
			CompletedAt:  time.Now().UTC().Format(time.RFC3339),
		}
	}

	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return ExecutionResult{
			JobID:        req.JobID,
			QuestionName: req.QuestionName,
			Status:       "failed",
			Language:     req.Language,
			UserCode:     req.UserCode,
			IsSubmission: req.IsSubmission,
			UserID:       req.UserID,
			Error:        fmt.Sprintf("executor request failed: %v", err),
			CompletedAt:  time.Now().UTC().Format(time.RFC3339),
		}
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ExecutionResult{
			JobID:        req.JobID,
			QuestionName: req.QuestionName,
			Status:       "failed",
			Language:     req.Language,
			UserCode:     req.UserCode,
			IsSubmission: req.IsSubmission,
			UserID:       req.UserID,
			Error:        fmt.Sprintf("read executor response: %v", err),
			CompletedAt:  time.Now().UTC().Format(time.RFC3339),
		}
	}

	status := "completed"
	if resp.StatusCode >= 400 {
		status = "failed"
	}

	return ExecutionResult{
		JobID:        req.JobID,
		QuestionName: req.QuestionName,
		Status:       status,
		Language:     req.Language,
		UserCode:     req.UserCode,
		IsSubmission: req.IsSubmission,
		UserID:       req.UserID,
		Result:       json.RawMessage(body),
		CompletedAt:  time.Now().UTC().Format(time.RFC3339),
	}
}
