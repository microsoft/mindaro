// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace app
{
    public class Program
    {
        private static CustomConfiguration _customConfiguration { get; set; }

        public static void Main(string[] args)
        {
            IConfiguration Configuration;
            var builder = new ConfigurationBuilder().AddJsonFile($"appsettings.json", true, true);
            Configuration = builder.Build();
            _customConfiguration = new CustomConfiguration();
            Configuration.GetSection("CustomConfiguration").Bind(_customConfiguration);

            BikesHelper.Init(_customConfiguration);
            BillingHelper.Init(_customConfiguration);
            MongoHelper.Init(_customConfiguration);         
            
            var host = WebHost.CreateDefaultBuilder<Startup>(args).Build();
            host.Run();    
            LogUtility.Log("Reservation engine service running.");

        }
    }
}