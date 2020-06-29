// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"fmt"
	"log"
	"os"
)

var flags = log.Flags() | log.LUTC | log.Lmicroseconds | log.Lshortfile
var stdLogger = log.New(os.Stdout, "", flags)
var errLogger = log.New(os.Stderr, "Error: ", flags)

// Log logs a standard message
func Log(format string, a ...interface{}) {
	logMessageTo(stdLogger, format, a...)
}

func LogWithContext(context *RequestContext, format string, a ...interface{}) {
	logMessageTo(stdLogger, fmt.Sprintf("%s - %s", context.RequestID.String(), format), a...)
}

// LogErrFormat logs an error message
func LogErrFormat(format string, a ...interface{}) {
	logMessageTo(errLogger, format, a...)
}

func LogErrFormatWithContext(context *RequestContext, format string, a ...interface{}) {
	logMessageTo(errLogger, fmt.Sprintf("%s - %s", context.RequestID.String(), format), a...)
}

// LogError logs an error type
func LogError(err error) {
	logMessageTo(errLogger, fmt.Sprintf("%v", err))
}

func LogErrorWithContext(context *RequestContext, err error) {
	logMessageTo(errLogger, fmt.Sprintf("%s - %v", context.RequestID.String(), err))
}

func logMessageTo(out *log.Logger, format string, a ...interface{}) {
	output := fmt.Sprintf(format, a...)
	out.Output(3, output)
}
