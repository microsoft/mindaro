// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace app.Middleware
{
    public class OperationContextMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger _logger;

        public OperationContextMiddleware(RequestDelegate next, ILogger<OperationContextMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public Task Invoke(HttpContext context)
        {
            OperationContext.CurrentContext.RequestId = Guid.NewGuid();
            OperationContext.CurrentContext.Logger = _logger;
            return this._next(context);
        }
    }
}
