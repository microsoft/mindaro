// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace app
{
    public class Constants
    {
        public const string MongoDbConnectionStringEnv = "mongo_connectionstring";

        public const string MongoDbDatabaseEnv = "mongo_dbname";

        public const string MongoDbCollectionEnv = "mongo_collection";

        public const string BikesMicroserviceEnv = "bikes_dnsname";

        public const string BillingMicroserviceEnv = "billing_dnsname";

        public const string RequestIdHeaderName = "x-contoso-request-id";

        public const string AzdsRouteAsHeaderName = "azds-route-as";

        public const string KubernetesRouteAsHeaderName = "kubernetes-route-as";
    }
}