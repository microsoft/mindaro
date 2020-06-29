// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace app
{
    public class Program
    {
        private static readonly HttpClient _httpClient = new HttpClient() { Timeout = TimeSpan.FromSeconds(10) };
        private static readonly string _gatewayUrl = $"http://{Environment.GetEnvironmentVariable("gateway_dnsname")}";
        private static readonly string _bikesUrl = $"http://{Environment.GetEnvironmentVariable("bikes_dnsname")}";
        private static readonly string _usersUrl = $"http://{Environment.GetEnvironmentVariable("users_dnsname")}";

        public static void Main(string[] args)
        {
            using (_httpClient)
            {
                _WaitForServiceReadiness().Wait();
                _PopulateDatabase().Wait();
                Console.WriteLine("Shutting down.");
            }
        }

        private async static Task _WaitForServiceReadiness()
        {
            Console.WriteLine($"gatewayUrl: {_gatewayUrl}");
            Console.WriteLine($"bikesUrl: {_bikesUrl}");
            Console.WriteLine($"usersUrl: {_usersUrl}");

            while (true)
            {
                Console.WriteLine("Checking to see if services are up...");

                // Check bikes
                bool bikesReady = false;
                try { bikesReady = (await _httpClient.GetAsync($"{_bikesUrl}/hello")).IsSuccessStatusCode; } catch { }
                if (!bikesReady)
                {
                    Console.WriteLine("Bikes not ready :(");
                    Console.WriteLine($"{_bikesUrl}/hello");
                }

                // Check users
                bool usersReady = false;
                try { usersReady = (await _httpClient.GetAsync($"{_usersUrl}/hello")).IsSuccessStatusCode; } catch { }
                if (!usersReady)
                {
                    Console.WriteLine("Users not ready :(");
                    Console.WriteLine($"{_usersUrl}/hello");
                }

                // Check gateway
                bool gatewayReady = false;
                try { gatewayReady = (await _httpClient.GetAsync($"{_gatewayUrl}/hello")).IsSuccessStatusCode; } catch { }
                if (!gatewayReady)
                {
                    Console.WriteLine("Gateway not ready :(");
                    Console.WriteLine($"{_gatewayUrl}/hello");
                }

                if (bikesReady && usersReady && gatewayReady)
                {
                    // Success!
                    Console.WriteLine("Services are up!");
                    break;
                }

                var sleep = TimeSpan.FromSeconds(10);
                Console.WriteLine($"Sleeping for {sleep.TotalSeconds} seconds and trying again...");
                await Task.Delay(sleep);
            }
        }

        private async static Task _PopulateDatabase()
        {
            Console.WriteLine("Populating databases...");

            // Read JSON directly from a file
            JObject data = JObject.Parse(File.ReadAllText(@"data.json"));
            JToken customers = (JToken)data.SelectToken("customers");
            JToken vendors = (JToken)data.SelectToken("vendors");
            JToken bikes = (JToken)data.SelectToken("bikes");

            // Add users and bikes
            Console.WriteLine("\n********************************************\nADDING USERS");
            foreach (var customer in customers)
            {
                Console.WriteLine("Adding user: " + customer.ToString());
                var response = await _httpClient.PostAsync(_gatewayUrl + "/api/user/",
                    new StringContent(customer.ToString(), Encoding.UTF8, "application/json"));
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine("Failed to add : " + customer.ToString());
                    Console.WriteLine(response.StatusCode + "  " + await response.Content.ReadAsStringAsync());
                }
            }

            Console.WriteLine("\n********************************************\nADDING VENDORS");
            foreach (var vendor in vendors)
            {
                Console.WriteLine("Adding vendor: " + vendor.ToString());
                var response = await _httpClient.PostAsync(_gatewayUrl + "/api/user/vendor",
                    new StringContent(vendor.ToString(), Encoding.UTF8, "application/json"));
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine("Failed to add : " + vendor.ToString());
                    Console.WriteLine(response.StatusCode + "  " + await response.Content.ReadAsStringAsync());
                }
            }

            Console.WriteLine("\n********************************************\nADDING BIKES");
            foreach (var bike in bikes)
            {
                Console.WriteLine("Adding bike: " + bike.ToString());
                var response = await _httpClient.PostAsync(_gatewayUrl + "/api/bike",
                    new StringContent(bike.ToString(), Encoding.UTF8, "application/json"));
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine("Failed to add : " + bike.ToString());
                    Console.WriteLine(response.StatusCode + "  " + await response.Content.ReadAsStringAsync());
                }
            }

            Console.WriteLine("Finished populating databases.");
        }
    }
}