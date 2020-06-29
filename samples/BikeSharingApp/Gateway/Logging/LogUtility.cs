// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Extensions.Logging;

namespace app.Logging
{
    public static class LogUtility
    {
        public static void Log(string format, params string[] args)
        {
            Console.WriteLine(string.Format($"{DateTime.UtcNow.ToString()}: {format}", args));
        }

        public static void LogWithContext(string format, params string[] args)
        {
            string newFormat = $"{DateTime.UtcNow.ToString()}: {OperationContext.CurrentContext.RequestId.ToString()} - {format}";
            OperationContext.CurrentContext.Logger.LogInformation(newFormat, args);
        }

        public static void LogError(string format, params string[] args)
        {
            Console.Error.WriteLine(string.Format($"{DateTime.UtcNow.ToString()}: {format}", args));
        }

        public static void LogErrorWithContext(string format, params string[] args)
        {
            string newFormat = $"{DateTime.UtcNow.ToString()}: {OperationContext.CurrentContext.RequestId.ToString()} - {format}";
            OperationContext.CurrentContext.Logger.LogError(newFormat, args);
        }
    }
}
