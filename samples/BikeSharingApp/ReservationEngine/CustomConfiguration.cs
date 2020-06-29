// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace app
{

    public class MongoDBConnectionInfo
    {
        public string ConnectionString { get; set; }

        public string Database { get; set; }

        public string Collection { get; set; }
    }

    public class Services
    {
        public string Bikes { get; set; }

        public string Billing { get; set; }
    }

    public class CustomConfiguration
    {
        public MongoDBConnectionInfo MongoDBConnectionInfo { get; set; }

        public Services Services { get; set; }
    }
}
