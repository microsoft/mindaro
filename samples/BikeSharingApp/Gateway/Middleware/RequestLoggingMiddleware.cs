// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using app.Logging;
using Microsoft.AspNetCore.Http;

namespace app.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public RequestLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            Stopwatch stopWatch = Stopwatch.StartNew();
            var responseStream = context.Response.Body;
            string responseBody = null;
            using (MemoryStream memStream = new MemoryStream())
            {
                context.Response.Body = memStream;

                await this._next(context);

                context.Response.Body = responseStream;
                // Writing to response body is not supported for 204, 205 and 304 responses.
                if (context.Response.StatusCode != 204 /* NoContent */ &&
                    context.Response.StatusCode != 205 /* ResetContent */ &&
                    context.Response.StatusCode != 304 /* NotModified */)
                {
                    memStream.Seek(0, SeekOrigin.Begin);
                    using (StreamReader reader = new StreamReader(memStream))
                    {
                        responseBody = await reader.ReadToEndAsync();
                    }
                    await context.Response.WriteAsync(responseBody);
                }
            }

            if (context.Response.StatusCode >= 500)
            {
                LogUtility.LogErrorWithContext("Returning error status code!: " + responseBody);
            }

            LogUtility.LogWithContext($"{context.Request.Path.Value} - {context.Response.StatusCode} - {stopWatch.ElapsedMilliseconds}ms");
        }
    }
}
