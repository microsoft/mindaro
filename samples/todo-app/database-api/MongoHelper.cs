// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;

namespace DatabaseApi
{
    public static class MongoHelper
    {
        private static string _connectionString { get; set; }

        private static string _database { get; set; }

        private static string _collection { get; set; }

        private static MongoClient _mongoClient;

        public static void Initialize(string connectionString, string database, string collection)
        {
            Console.WriteLine("MongoHelper initialization start");
            _database = database;
            _collection = collection;
            _mongoClient = new MongoClient(connectionString);
            ValidateMongoConnection(_mongoClient, _database);
            Console.WriteLine("MongoHelper initialization end");
        }

        private static async void ValidateMongoConnection(MongoClient mongoClient, string database)
        {
            var db = mongoClient.GetDatabase(database);

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
                    Console.Error.WriteLine("Exception pinging Mongo: " + e.ToString());
                    Environment.Exit(1);
                }

                await Task.Delay(3000);
            }
        }

        public static IEnumerable<TodoTask> GetTasks()
        {
            Console.WriteLine("Getting all TODO tasks");
            var db = _mongoClient.GetDatabase(_database);
            var collection = db.GetCollection<TodoTask>(_collection).WithWriteConcern(new WriteConcern("majority"));
            return collection.AsQueryable();
        }

        public static async Task<TodoTask> CreateTask(TodoTask task)
        {
            Console.WriteLine($"Creating TODO task '{task.Title}'");
            var db = _mongoClient.GetDatabase(_database);
            var collection = db.GetCollection<TodoTask>(_collection).WithWriteConcern(new WriteConcern("majority"));
            await collection.InsertOneAsync(task);
            return task;
        }

        public static async Task<IEnumerable<TodoTask>> UpdateTask(string id, TodoTask updatedTask)
        {
            var tasks = GetTasks();
            var task = tasks.FirstOrDefault(task => task.Id == id);
            if (task == null)
            {
                throw new Exception($"The TODO task of id '{id}' doesn't exist in database.");
            }
            Console.WriteLine($"Updating TODO task '{task.Title}'");
            var db = _mongoClient.GetDatabase(_database);
            var collection = db.GetCollection<TodoTask>(_collection).WithWriteConcern(new WriteConcern("majority"));
            var filter = Builders<TodoTask>.Filter.Eq("title", task.Title);
            var update = Builders<TodoTask>.Update.Set("title", updatedTask.Title).Set("completed", updatedTask.Completed);
            await collection.UpdateOneAsync(filter, update);
            return collection.AsQueryable();
        }

        public static async Task<IEnumerable<TodoTask>> DeleteTask(string id)
        {
            var tasks = GetTasks();
            var task = tasks.FirstOrDefault(task => task.Id == id);
            if (task == null)
            {
                throw new Exception($"The TODO task of id '{id}' doesn't exist in database.");
            }
            Console.WriteLine($"Deleting TODO task '{task.Title}'");
            var db = _mongoClient.GetDatabase(_database);
            var collection = db.GetCollection<TodoTask>(_collection).WithWriteConcern(new WriteConcern("majority"));
            var filter = Builders<TodoTask>.Filter.Eq("title", task.Title);
            await collection.DeleteOneAsync(filter);
            return collection.AsQueryable();
        }
    }
}