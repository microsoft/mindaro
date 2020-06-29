// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using app.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace app
{
    public static class HttpHelper
    {
        private static HttpClient httpClient = new HttpClient();

        public static Task<HttpResponseMessage> GetAsync(string url, HttpRequest originRequest)
        {
            return doHttpAndLog(new HttpRequestMessage(HttpMethod.Get, url).AddOutboundHeaders(originRequest));
        }

        public static Task<HttpResponseMessage> PostAsync(string url, HttpContent content, HttpRequest originRequest)
        {
            return doHttpAndLog(new HttpRequestMessage(HttpMethod.Post, url) { Content = content }.AddOutboundHeaders(originRequest));
        }

        public static Task<HttpResponseMessage> PutAsync(string url, HttpContent content, HttpRequest originRequest)
        {
            return doHttpAndLog(new HttpRequestMessage(HttpMethod.Put, url) { Content = content }.AddOutboundHeaders(originRequest));
        }

        public static Task<HttpResponseMessage> DeleteAsync(string url, HttpRequest originRequest)
        {
            return doHttpAndLog(new HttpRequestMessage(HttpMethod.Delete, url).AddOutboundHeaders(originRequest));
        }

        public static Task<HttpResponseMessage> PatchAsync(string url, HttpContent content, HttpRequest originRequest)
        {
            return doHttpAndLog(new HttpRequestMessage(new HttpMethod("PATCH"), url) { Content = content }.AddOutboundHeaders(originRequest));
        }

        private static async Task<HttpResponseMessage> doHttpAndLog(HttpRequestMessage message)
        {
            Stopwatch stopWatch = Stopwatch.StartNew();

            var response = await httpClient.SendAsync(message);

            Action<string, string[]> logFunc = LogUtility.LogWithContext;
            if (!response.IsSuccessStatusCode)
            {
                logFunc = LogUtility.LogErrorWithContext;
            }

            logFunc($"called: {message.Method.ToString()} {message.RequestUri.ToString()} - {(int)response.StatusCode} - {stopWatch.ElapsedMilliseconds}ms", null);
            return response;
        }

        public static async Task<ContentResult> ReturnResponseResult(HttpResponseMessage response)
        {
            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                Content = await response.Content.ReadAsStringAsync()
            };
        }

        public static ContentResult Return500Result(string errorMsg)
        {
            return new ContentResult
            {
                StatusCode = (int)HttpStatusCode.InternalServerError,
                Content = errorMsg
            };
        }
    }
}