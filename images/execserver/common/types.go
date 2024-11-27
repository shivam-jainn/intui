package common

type JobData struct {
	UserCode     string   `json:"userCode"`
	Language     string   `json:"language"`
	QuestionName string   `json:"questionName"`
	IsSubmission string   `json:"isSubmission"`
	TestCases    []string `json:"testCases"`
}
