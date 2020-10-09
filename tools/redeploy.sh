#!/bin/bash
set -e

# Please install the below pre-requisites if using this on your local machine, or alternately, you can just use azure bash cloudshell for a seamless experience.
#1. azure cli    :   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest
#2. kubectl      :   https://kubernetes.io/docs/tasks/tools/install-kubectl/
#3. docker       :   https://docs.docker.com/engine/install/
#4. curl
#5. gunzip
#6. tar

HELMDIR=/var/tmp/helm_migrate
INGRESSNAME=migration-traefik
ENABLEINGRESS=false

echo ""
echo "Migrate assets of Azure Dev Spaces to Bridge to Kubernetes"
echo "----------------------------------------------------------"
echo ""

helpFunction()
{
   echo ""
   echo "Usage: $1 -g ResourceGroupName -n AKSName -h DockerHubName"
   echo -e "\t-g Name of resource group of AKS Cluster"
   echo -e "\t-n Name of AKS Cluster"
   echo -e "\t-k Kubernetes namespace (uses 'default' namespace otherwise)"
   echo -e "\t-r Path to Root of the project that needs to be migrated (default = pwd)"
   echo -e "\t-h Docker Hub repository name"
   echo -e "\t-t Docker image name & tag in format name:tag (default = projectName:stable)"
   echo -e "\t-i Enable ingress (default = false)"
   echo -e "\t-d Helm Debug switch"
   exit 1 # Exit script after printing help
}

installHelmFunction()
{
  if [ ! -d "$HELMDIR" ]; then
    echo "Creating directory for helm"
    mkdir $HELMDIR
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
       curl -fsSL -o $HELMDIR/helm.tar.gz https://get.helm.sh/helm-v3.2.1-linux-amd64.tar.gz
       gunzip -c $HELMDIR/helm.tar.gz | tar xopf - -C $HELMDIR
       mv $HELMDIR/linux-amd64/helm $HELMDIR
    elif [[ "$OSTYPE" == "darwin"* ]]; then
       curl -fsSL -o $HELMDIR/helm.tar.gz https://get.helm.sh/helm-v3.2.1-darwin-amd64.tar.gz
       gunzip -c $HELMDIR/helm.tar.gz | tar xopf - -C $HELMDIR
       mv $HELMDIR/darwin-amd64/helm $HELMDIR
    else
       echo "OS not recognized. Please either run on linux-gnu or osx"
       exit 1
    fi
  fi
}

while getopts "g:n:r:d:k:h:ti" opt; do
   case "$opt" in
      g ) RGNAME="$OPTARG"  ;;
      n ) AKSNAME="$OPTARG"  ;;
      r ) PROJECTROOT="$OPTARG"  ;;
      d ) HELMARGS=" --debug" ;;
      k ) NAMESPACE="$OPTARG" ;;
      h ) DOCKERREPO="$OPTARG" ;;
      t ) IMAGENAMEANDTAG="$OPTARG" ;;
      i ) ENABLEINGRESS="true" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

# Print helpFunction in case parameters are empty
if [ -z "$RGNAME" ] || [ -z "$AKSNAME" ] || [ -z "$DOCKERREPO" ]; then
   echo "Some or all of the parameters are empty";
   helpFunction
fi

if [ -z "$NAMESPACE" ]; then
   NAMESPACE="default"
fi
NAMESPACE=$(echo $NAMESPACE | tr [:upper:] [:lower:])
echo "Using kubernetes namespace: $NAMESPACE"

if [ -z "$PROJECTROOT" ]; then
   PROJECTROOT="$(pwd)"
fi
echo "Using project root: $PROJECTROOT"

echo "Checking directory $PROJECTROOT for 'azds.yaml', 'Dockerfile' & 'charts' folder"
if [ ! -f "$PROJECTROOT/azds.yaml" ] || [ ! -f "$PROJECTROOT/Dockerfile" ] || [ ! -d "$PROJECTROOT/charts" ]; then
  echo "$(tput setaf 1)ERROR: '$PROJECTROOT' doesn't seem to be initialized by Azure Dev Spaces. $(tput sgr 0)"
  echo "Was 'azds prep' ever run in this project?"
  exit 1
fi

echo "Directory $PROJECTROOT is initialized for Azure Dev Spaces."
echo "Migrating assets..."

PROJECTNAME=$(basename $PROJECTROOT)
if [ -z "$IMAGENAMEANDTAG" ]; then
   IMAGENAMEANDTAG="$PROJECTNAME:stable"
fi

installHelmFunction

echo "docker build: $PROJECTNAME "
docker build -f "$PROJECTROOT/Dockerfile.develop" -t "$DOCKERREPO/$IMAGENAMEANDTAG" "$PROJECTROOT"
echo
echo "Pushing image: $DOCKERREPO/$IMAGENAMEANDTAG"
docker push "$DOCKERREPO/$IMAGENAMEANDTAG"

echo "Updating the image name in $PROJECTROOT/charts/$PROJECTNAME/values.yaml file:"
IFS=':' read -ra IMAGENAMEARRAY <<< "$DOCKERREPO/$IMAGENAMEANDTAG"

sed -i "s^repository:.*^repository: ${IMAGENAMEARRAY[0]}^g" "$PROJECTROOT/charts/$PROJECTNAME/values.yaml"
sed -i "s^tag:.*^tag: ${IMAGENAMEARRAY[1]}^g" "$PROJECTROOT/charts/$PROJECTNAME/values.yaml"

echo "Setting the Kube context to $AKSNAME in $RGNAME"
az aks get-credentials -g $RGNAME -n $AKSNAME

if [[ $ENABLEINGRESS == "true" ]]; then
   # Use Helm to deploy a traefik ingress controller
   echo "helm repo add && helm repo update"
   $HELMDIR/helm repo add stable https://kubernetes-charts.storage.googleapis.com/
   $HELMDIR/helm repo update

   echo ""
   echo "helm install traefik ingress controller in $NAMESPACE $HELMARGS"
   $HELMDIR/helm install "$INGRESSNAME-$NAMESPACE" stable/traefik \
      --namespace $NAMESPACE --create-namespace \
      --set kubernetes.ingressClass=traefik \
      --set fullnameOverride=$INGRESSNAME \
      --set rbac.enabled=true \
      --set kubernetes.ingressEndpoint.useDefaultPublishedService=true \
      --version 1.85.0 $HELMARGS

   echo ""
   echo "Waiting for the Public IP to be assigned to load balancer..."
   while [ -z "$PUBLICIP" ]; do
   sleep 5
   PUBLICIP=$(kubectl get svc -n $NAMESPACE $INGRESSNAME -o jsonpath={.status.loadBalancer.ingress[0].ip})
   done
   echo ""
   echo "Load Balancer's Public IP: " $PUBLICIP
fi
 
CHARTDIR="$PROJECTROOT/charts/$PROJECTNAME"
echo "---"
echo "Chart directory: $CHARTDIR"



echo "helm install $PROJECTNAME"
$HELMDIR/helm install $PROJECTNAME "$CHARTDIR" \
   --set ingress.hosts={"$NAMESPACE.$PROJECTNAME.$PUBLICIP.nip.io"} \
   --set ingress.enable="$ENABLEINGRESS" \
   --set ingress.annotations."kubernetes\.io/ingress\.class"="traefik" \
   --dependency-update \
   --namespace $NAMESPACE \
   --timeout 9m \
   --atomic $HELMARGS

echo ""

if [[ $ENABLEINGRESS == "true" ]]; then
   echo "To try out the app, open the url:"
   kubectl -n $NAMESPACE get ing $PROJECTNAME -o jsonpath='{.spec.rules[0].host}'
   echo ""
fi

