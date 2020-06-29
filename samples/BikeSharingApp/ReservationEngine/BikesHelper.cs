// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Net.Http;
using System.Threading.Tasks;
using app.Models;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;

namespace app
{
    public static class BikesHelper
    {
        private static string _bikesService { get; set; }

        public static void Init(CustomConfiguration customConfiguration)
        {
            LogUtility.Log("BikesHelper init start");
            _bikesService = Environment.GetEnvironmentVariable(Constants.BikesMicroserviceEnv) ?? customConfiguration.Services.Bikes;
            LogUtility.Log("BikesHelper init end");
        }

        public static async Task<HttpResponseMessage> ReserveBike(Guid requestId, string bikeId, HttpRequest originRequest)
        {
            LogUtility.LogWithContext(requestId, "Reserving BikeID " + bikeId);
            string reserveBikeUrl = $"http://{_bikesService}/api/bikes/{bikeId}/reserve";
            var response = await HttpHelper.PatchAsync(requestId, reserveBikeUrl, null, originRequest);
            return response;
        }

        public static async Task<HttpResponseMessage> FreeBike(Guid requestId, string bikeId, HttpRequest originRequest)
        {
            LogUtility.LogWithContext(requestId, "Freeing BikeID " + bikeId);
            string freeBikeUrl = $"http://{_bikesService}/api/bikes/{bikeId}/clear";
            var response = await HttpHelper.PatchAsync(requestId, freeBikeUrl, null, originRequest);
            return response;
        }

        public static async Task<Bike> GetBike(Guid requestId, string bikeId, HttpRequest originRequest)
        {
            LogUtility.LogWithContext(requestId, "Getting BikeID " + bikeId);
            string getBikeUrl = $"http://{_bikesService}/api/bikes/{bikeId}";
            var response = await HttpHelper.GetAsync(requestId, getBikeUrl, originRequest);
            if (response.IsSuccessStatusCode)
            {
                var bikeDetails = JsonConvert.DeserializeObject<Bike>(await response.Content.ReadAsStringAsync());
                return bikeDetails;
            }

            return null;
        }
    }
}