// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text;

namespace app
{
    public static class LogUtility
    {
        public static void Log(string format, params string[] args)
        {
            string msg = $"{DateTime.UtcNow.ToString()}: {format}";
            Console.WriteLine(string.Format(msg, args));
        }

        public static void LogWithContext(Guid requestId, string format, params string[] args)
        {
            string msg = $"{DateTime.UtcNow.ToString()}: {requestId.ToString()}: {format}";
            Console.WriteLine(string.Format(msg, args));
        }

        public static void LogError(string format, params string[] args)
        {
            string msg = $"{DateTime.UtcNow.ToString()}: {format}";
            Console.Error.WriteLine(string.Format(msg, args));
        }

        public static void LogErrorWithContext(Guid requestId, string format, params string[] args)
        {
            string msg = $"{DateTime.UtcNow.ToString()}: {requestId.ToString()}: {format}";
            Console.Error.WriteLine(string.Format(msg, args));
        }
    }
}
