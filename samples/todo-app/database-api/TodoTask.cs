// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Runtime.Serialization;

namespace DatabaseApi
{
    [DataContract]
    [BsonIgnoreExtraElements]
    public class TodoTask
    {
        [DataMember]
        [BsonId]
        private ObjectId ObjectId { get; set; }

        [DataMember]
        [BsonElement("id")]
        public string Id => ObjectId.ToString();

        [DataMember]
        [BsonElement("title")]
        public string Title { get; set; }

        [DataMember]
        [BsonElement("completed")]
        public bool Completed { get; set; }
    }
}
