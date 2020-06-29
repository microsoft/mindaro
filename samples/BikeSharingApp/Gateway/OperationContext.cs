// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading;
using Microsoft.Extensions.Logging;

namespace app
{
    public class OperationContext
    {
        public Guid RequestId { get; set; }

        public ILogger Logger { get; set; }

        private static AsyncLocal<OperationContext> asyncLocal = new AsyncLocal<OperationContext>();
        /// <summary>
        /// Gets the operation context on the current logical thread of execution.
        /// </summary>
        public static OperationContext CurrentContext
        {
            get
            {
                if (asyncLocal.Value == null)
                {
                    asyncLocal.Value = new OperationContext();
                }

                return asyncLocal.Value;
            }
        }
    }
}
