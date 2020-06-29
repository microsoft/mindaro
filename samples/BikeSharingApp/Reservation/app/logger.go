// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package main

import (
	"fmt"
	"log"
	"os"
)

var flags = log.Flags() | log.LUTC | log.Lmicroseconds | log.Lshortfile
var stdLogger = log.New(os.Stdout, "Reservation Service: ", flags)
var errLogger = log.New(os.Stderr, "Reservation Service Error: ", flags)

func LogInfo(format string, a ...interface{}) {
	str := fmt.Sprintf(format, a...)
	stdLogger.Output(3, str)
}

func LogError(format string, a ...interface{}) {
	str := fmt.Sprintf(format, a...)
	errLogger.Output(3, str)
}
