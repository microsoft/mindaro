// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using app.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace app
{
    public static class MongoHelper
    {
        private static string _connectionString { get; set; }

        private static string _database { get; set; }

        private static string _collection { get; set; }

        private static MongoClient _mongoClient;

        public static void Init(CustomConfiguration customConfiguration)
        {
            LogUtility.Log("MongoHelper init start");
            _connectionString = Environment.GetEnvironmentVariable(Constants.MongoDbConnectionStringEnv) ?? customConfiguration.MongoDBConnectionInfo.ConnectionString;
            _database = Environment.GetEnvironmentVariable(Constants.MongoDbDatabaseEnv) ?? customConfiguration.MongoDBConnectionInfo.Database;
            _collection = Environment.GetEnvironmentVariable(Constants.MongoDbCollectionEnv) ?? customConfiguration.MongoDBConnectionInfo.Collection;
            _mongoClient = new MongoClient(_connectionString);
            CheckConnectionLoop();
            LogUtility.Log("MongoHelper init end");
        }

        private static async void CheckConnectionLoop()
        {
            var db = _mongoClient.GetDatabase(_database);

            while (true)
            {
                try
                {
                    BsonDocument isMongoLive = await db.RunCommandAsync((Command<BsonDocument>)"{ping:1}");
                    if (!isMongoLive.Contains("ok") || isMongoLive["ok"].AsDouble != 1.0)
                    {
                        Console.Error.WriteLine("Mongo connection dead! Shutting down.");
                        Environment.Exit(1);
                    }
                }
                catch (Exception e)
                {
                    Console.Error.WriteLine("Exception pinging Mongo:");
                    Console.Error.WriteLine(e.ToString());
                    Environment.Exit(1);
                }

                await Task.Delay(3000);
            }
        }

        /// <summary>
        /// Updates ONLY the State field of the reservation in the DB
        /// </summary>
        /// <param name="reservationDetails"></param>
        /// <returns></returns>
        public static async Task<UpdateResult> UpdateReservationStateAndEndTime(Guid requestId, Reservation reservationDetails)
        {
            LogUtility.LogWithContext(requestId, "Updating reservationID " + reservationDetails.ReservationId);
            var db = _mongoClient.GetDatabase(_database);
            var collection = db.GetCollection<Reservation>(_collection).WithWriteConcern(new WriteConcern("majority"));

            var filter = Builders<Reservation>.Filter.Eq("reservationId", reservationDetails.ReservationId);
            var update = Builders<Reservation>.Update.Set("state", reservationDetails.State).Set("endTime", reservationDetails.EndTime);

            var result = await collection.UpdateOneAsync(filter, update);
            return result;
        }
    }
}