// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace DatabaseApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var connectionString = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING");
            var database = "todos";
            var collection = "todos";
            MongoHelper.Initialize(connectionString, database, collection);
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
