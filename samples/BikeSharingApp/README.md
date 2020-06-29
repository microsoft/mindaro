# Deploy the Bike Sharing sample application to Azure Kubernetes Service

*Bike Sharing* is a microservices-based sample application that helps showcase the sandboxing capabilities of [Azure Dev Spaces](https://aka.ms/devspaces). 

Follow the steps below to deploy this sample app to Azure Kubernete Service (AKS).

## Prerequisites
* [Azure subscription](https://azure.microsoft.com/free)
* [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli?view=azure-cli-latest)
* [Helm 3 (or greater)](https://helm.sh/docs/intro/install)

## Configure Azure resources

1. **Create an Azure Kubernetes Service cluster.** You must create an AKS cluster in a [supported region](https://docs.microsoft.com/azure/dev-spaces/about#supported-regions-and-configurations). The below commands create a resource group called `MyResourceGroup` and an AKS cluster called `MyAKS` in the `eastus` region.

    ```bash
    az login
    az group create --name MyResourceGroup --location eastus
    az aks create -g MyResourceGroup -n MyAKS --location eastus --disable-rbac --generate-ssh-keys
    ```

1. **Enable Azure Dev Spaces on the AKS cluster.**
    ```bash
    az aks use-dev-spaces -g MyResourceGroup -n MyAKS --space dev --yes
    ```

## Deploy the BikeSharing sample app

1. **[Create a fork](https://guides.github.com/activities/forking/) of this GitHub repo.** It's better to create a *fork* for this exercise so that you can save your own commits and repo configuration.

1. **Clone your fork and navigate into its directory**.
    ```bash
    git clone https://github.com/USERNAME/dev-spaces
    cd dev-spaces/samples/BikeSharingApp/
    ```

1. **Retrieve the HostSuffix for the `dev` dev space.**
    ```bash
    azds show-context

    Name                ResourceGroup     DevSpace  HostSuffix                 EndpointType
    ------------------  ----------------  --------  -----------------------    ------------
    MyAKS               MyResourceGroup   dev       fedcab0987.eus.azds.io     Public
    ```

1. **Update the Helm chart with your HostSuffix.** Open [`charts/values.yaml`](https://github.com/Azure/dev-spaces/blob/master/samples/BikeSharingApp/charts/values.yaml) and replace all instances of `<REPLACE_ME_WITH_HOST_SUFFIX>` with the HostSuffix value you retrieved earlier. Save your changes and close the file.

1. **Deploy the sample application to Kubernetes.** We'll use Helm to run this sample application, but other tooling could be used to run your entire application in a namespace within a cluster. The Helm commands are targeting the namespace named `dev` you created earlier, and can take several minutes to complete.
    ```bash
    cd charts/
    helm install bikesharingsampleapp . --dependency-update --namespace dev --atomic
    ```

1. **Open your browser to the app's website.** Run the `azds list-uris` command to see the public endpoints in the running app. Navigate to the `bikesharingweb` service - in the below example, the public URL for the `bikesharingweb` service is http://dev.bikesharingweb.fedcab0987.eus.azds.io/. Select **Aurelia Briggs (customer)** as the user, then select a bike to rent.
    ```bash
    azds list-uris

    Uri                                                Status
    -----------------------------------------------    ---------
    http://dev.bikesharingweb.fedcab0987.eus.azds.io/  Available
    http://dev.gateway.fedcab0987.eus.azds.io/         Available
    ```

1. **Commit and push to your forked repo.** This will ensure that feature branches you create going forward will also have the configuration changes you made earlier.
    ```bash
    git commit -am "update HostSuffix"
    git push origin master
    ```

## Next Steps
Now that you have the BikeSharing app deployed in AKS, try these walkthroughs to learn how Dev Spaces can enhance the Kubernetes development experience:

1. **[Use your public endpoint in the cloud to privately debug backend code that’s running on your local dev machine.](https://aka.ms/devspaces/connect)** This minimizes what you need to set up on your dev machine – the only thing you need to run on your machine is the microservice you’re working on and your preferred dev tools, no need to set up mocks or simulators. You don’t even need Kubernetes YAML or Docker configuration to do this, and you won’t affect the currently deployed app or anyone who’s using the AKS cluster.

1. **[Debug and iterate code directly in AKS.](https://docs.microsoft.com/azure/dev-spaces/quickstart-netcore)** This is similar to the first scenario, except this mode enables a *higher fidelity development and testing experience* by running your code as a container directly in AKS. Dev Spaces can help you generate Docker and Kubernetes assets.

1. **[Combine GitHub Actions with Dev Spaces in a pull request review.](https://aka.ms/devspaces/pr-flow)** You can use GitHub Actions to automatically deploy to a new sandbox whenever a pull request is opened so that your team can review a live version of the app that includes your pull request changes – all before that code is merged into your main branch! As a bonus, team members such as product managers and designers can become part of the review process during early stages of development.

## Clean up
This command deletes all Azure resources created for this sample:
```bash
az group delete --name MyResourceGroup --yes --no-wait
```