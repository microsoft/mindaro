// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"fmt"
	"path/filepath"
	"runtime"
	"strings"
)

// AddMyInfoToErr gets the callers info and prepends to the error
func AddMyInfoToErr(err error) error {
	return AddCallerInfoToErr(err, 2) // '2' to get the calling function
}

// AddCallerInfoToErr adds the callers filename, function name, and line number to the provided error and returns a new one
// 'numFramesToSkip' specifies the number of frames to skip for grabbing this info
func AddCallerInfoToErr(err error, numFramesToSkip int) error {
	funcPtr, fileName, line, ok := runtime.Caller(numFramesToSkip)
	if !ok {
		LogErrFormat("couldn't get caller info")
		return err
	}

	_, fileName = filepath.Split(fileName)
	functionName := runtime.FuncForPC(funcPtr).Name()
	functionName = strings.Split(functionName, ".")[1]

	return fmt.Errorf("%s:%s:%d: %v", fileName, functionName, line, err)
}
