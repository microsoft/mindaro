// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace app
{
    public static class HttpHelper
    {
        private static HttpClient _httpClient = new HttpClient();

        public static Task<HttpResponseMessage> GetAsync(Guid requestId, string url, HttpRequest originRequest)
        {
            var request = new HttpRequestMessage
            {
                Method = HttpMethod.Get,
                RequestUri = new Uri(url)
            };

            return SendAndLogAsync(requestId, request, originRequest);
        }

        public static Task<HttpResponseMessage> PostAsync(Guid requestId, string url, HttpContent content, HttpRequest originRequest)
        {
            var request = new HttpRequestMessage
            {
                Method = HttpMethod.Post,
                RequestUri = new Uri(url),
                Content = content
            };

            return SendAndLogAsync(requestId, request, originRequest);
        }

        public static Task<HttpResponseMessage> PatchAsync(Guid requestId, string url, HttpContent content, HttpRequest originRequest)
        {
            var request = new HttpRequestMessage
            {
                Method = new HttpMethod("PATCH"),
                RequestUri = new Uri(url),
                Content = content
            };

            return SendAndLogAsync(requestId, request, originRequest);
        }

        private static async Task<HttpResponseMessage> SendAndLogAsync(Guid requestId, HttpRequestMessage request, HttpRequest originRequest)
        {
            Stopwatch stopWatch = Stopwatch.StartNew();
            request.Headers.Add(Constants.RequestIdHeaderName, requestId.ToString());
            if (originRequest.Headers.ContainsKey(Constants.AzdsRouteAsHeaderName))
            {
                request.Headers.Add(Constants.AzdsRouteAsHeaderName, originRequest.Headers[Constants.AzdsRouteAsHeaderName].ToArray());
            }

            if (originRequest.Headers.ContainsKey(Constants.KubernetesRouteAsHeaderName))
            {
                request.Headers.Add(Constants.KubernetesRouteAsHeaderName, originRequest.Headers[Constants.KubernetesRouteAsHeaderName].ToArray());
            }
            var response = await _httpClient.SendAsync(request);
            LogUtility.LogWithContext(requestId, "Dependency: {0} {1} - {2} - {3}ms", request.Method.Method, request.RequestUri.ToString(), response.StatusCode.ToString(), stopWatch.ElapsedMilliseconds.ToString());
            return response;
        }
    }
}