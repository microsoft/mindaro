# Azure Local Process GitHub Action for adding the review url on pull request
Local Process for Kubernetes (LPK) can provide reviewers a live, sandboxed preview of the pull request's changes before code is merged into the main branch. The add-review-url GitHub Action writes the URL of the preview app as a comment on the pull request.

## How to include this action in our pull request workflow
Refer to the documentation for [Local Process for Kubernetes sample app](https://github.com/microsoft/mindaro) - [Pull Request Flow Documentation for Azure Dev Spaces](https://aka.ms/devspaces/pr-flow#configure-your-github-action)

## Example workflow syntax 
The following Action snippet is used in the [Bikesharing sample PR workflow ](https://github.com/microsoft/mindaro/blob/master/.github/workflows/bikes.yml), which also demonstrates how to use this action with [Kubernetes Bake](https://github.com/Azure/k8s-bake).
```
    - uses: microsoft/mindaro/actions/add-review-url@Releases/v2              
        with:
            repo-token: ${{ secrets.GITHUB_TOKEN }}  
            branch-name: ${{steps.generate-valid-branch-name.outputs.result}}
            host: "${{ secrets.HOST }}"
            protocol: "http"
 ```       
where secrets.INGRESS is the host URL for the app deployed in AKS. See [Pull Request Flow Documentation for Local Process for Kubernetes](https://aka.ms/devspaces/pr-flow#configure-your-github-action)

## How to build this GitHub Action for development
Navigate to the directory: .\actions\add-review-url\src and run
```
    npm install
    npm run build
```
## How to build and test the unit tests for this GitHub Action
Using Jest Test Framework. 
Refer to tests in \actions\add-review-url\__test__
```     
        npm install
        npm run build
        npm run test        
```