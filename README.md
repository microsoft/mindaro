# Local Process with Kubernetes
 
Local Process with Kubernetes extends the Kubernetes perimeter to your development computer allowing you to write, test, and debug microservice code while connected to your Kubernetes cluster with the rest of your application or services. With this workflow, there is no need for extra assets, such as a Dockerfile or Kubernetes manifests. You can simply run your code natively on your development workstation while connected to the Kubernetes cluster, allowing you to test your code changes in the context of the larger application.

![Alt Text](https://github.com/microsoft/mindaro/raw/master/assets/lpk-graphic-new.gif)

### Key Features:

#### Simplifying Microservice Development 
- Eliminate the need to manually source, configure and compile external dependencies on your development computer.  

#### Easy Debugging 
- Run your usual debug profile with the added cluster configuration. You can debug your code as you normally would while taking advantage of the speed and flexibility of local debugging. 

#### Developing and Testing End-to-End 
- Test end-to-end during development time. Select an existing service in the cluster to route to your development machine where an instance of that service is running locally. Request initiated through the frontend of the application running in Kubernetes will route between services running in the cluster until the service you specified to redirect is called. 

## Documentation
Product documentation is hosted here:
- [Visual Studio](https://aka.ms/localprocesswithk8s-vs)
- [Visual Studio Code](https://aka.ms/localprocesswithk8s-vsc)
- [How Local Process with Kubernetes Works](https://aka.ms/lpk-how-it-works)

## Roadmap
https://github.com/microsoft/mindaro/projects

## Purpose of this repository
This source repository primarily hosts *code samples* to support product guides, discussion of bugs/feature requests, as well as provide high-level insight into our product roadmap.

## Contributing
This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
