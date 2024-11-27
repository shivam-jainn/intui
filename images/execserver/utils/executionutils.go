package utils

import (
	"bytes"
	"os"
	"os/exec"
)

func ExecuteCode(userCode, language string) (string, error) {
	var cmd *exec.Cmd

	switch language {
	case "python":
		cmd = exec.Command("python3", "-c", userCode)
	case "cpp":
		tempFileName := "temp.cpp"
		err := os.WriteFile(tempFileName, []byte(userCode), 0644)
		if err != nil {
			return "", err
		}
		cmd = exec.Command("g++", tempFileName, "-o", "temp.out")
		if err := cmd.Run(); err != nil {
			return "", err
		}
		cmd = exec.Command("./temp.out")
	default:
		return "", &UnsupportedLanguageError{Language: language}
	}

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return stderr.String(), err
	}

	return out.String(), nil
}

type UnsupportedLanguageError struct {
	Language string
}

func (e *UnsupportedLanguageError) Error() string {
	return "Unsupported language: " + e.Language
}
