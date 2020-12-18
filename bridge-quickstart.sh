#!/bin/bash
set -e

# Please install the below pre-requisites if using this on your local machine, or alternately, you can just use Azure Cloud Shell for a seamless experience.
#1. azure cli    :   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest
#2. kubectl      :   https://kubernetes.io/docs/tasks/tools/install-kubectl/
#3. curl
#4. gunzip
#5. tar

HELMDIR=/var/tmp/helm_bridge
INGRESSNAME=bikesharing-traefik

echo ""
echo "Bridge to Kubernetes"
echo "Bike Sample App - Quickstart script"
echo "-----------------------------------"
echo ""
if [ "$OSTYPE" == "msys" ]; then
   echo "The script is currently only supported in Windows using WSL. https://aka.ms/wsl"  
   echo "Alternatively you can use the Azure Cloud Shell https://shell.azure.com (bash)"
   
   exit 1
fi

helpFunction()
{
   echo ""
   echo "Usage: $1 -g ResourceGroupName -n AKSName"
   echo -e "\t-g Name of resource group of AKS Cluster"
   echo -e "\t-n Name of AKS Cluster"
   echo -e "\t-k Kubernetes namespace (default = bikeapp)"
   echo -e "\t-r Path to Root of the git repo (default = pwd)"
   echo -e "\t-c Cleanup"
   echo -e "\t-d Helm Debug switch"
   exit 1 # Exit script after printing help
}

installHelmFunction()
{
  if [ ! -d "$HELMDIR" ]; then
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

cleanupFunction()
{
   set +e
   echo ""
   echo "Setting the Kube context to $AKSNAME in $RGNAME"
   az aks get-credentials -g $RGNAME -n $AKSNAME
   $HELMDIR/helm --namespace $BIKENS uninstall bikesharingapp
   $HELMDIR/helm --namespace $BIKENS uninstall $INGRESSNAME
   echo "Delete namespace $BIKENS? (Y/n): "
   read RESPONSE
   if [ "$RESPONSE" == "y" ] || [ "$RESPONSE" == "Y" ]; then
      kubectl delete namespace $BIKENS
   fi
   rm -rf $HELMDIR
   exit 0
}

while getopts "g:n:r:k:cd" opt; do
   case "$opt" in
      c ) CLEANUP="true"  ;;
      g ) RGNAME="$OPTARG"  ;;
      n ) AKSNAME="$OPTARG"  ;;
      r ) REPOROOT="$OPTARG"  ;;
      d ) HELMARGS=" --debug" ;;
      k ) BIKENS="$OPTARG" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

if [ -z "$BIKENS" ]; then
   BIKENS="bikeapp"
fi
BIKENS=$(echo $BIKENS | tr [:upper:] [:lower:])
echo "Using kubernetes namespace: $BIKENS"

# Print helpFunction in case parameters are empty
if [ ! -z "$CLEANUP" ]; then
   echo ""
   echo "Running app Cleanup"
   if [ -z "$RGNAME" ]; then
      echo "Please pass -g when calling -c"
      helpFunction
   else
      cleanupFunction
   fi
elif [ -z "$RGNAME" ] || [ -z "$AKSNAME" ]; then
   echo "Some or all of the parameters are empty";
   helpFunction
fi

if [ -z "$REPOROOT" ]; then
   echo "Defaulting Git repository root to current directory: $PWD"
   REPOROOT="$PWD"
fi

echo "Checking directory $REPOROOT for GIT repo Microsoft/Mindaro"
if [ ! -d "$REPOROOT/samples/BikeSharingApp" ]; then
  echo "$(tput setaf 1)ERROR: BikeSharingApp not found in $REPOROOT/samples/BikeSharingApp$(tput sgr 0)"
  echo "Did you download the git repo?"
  echo "Run; git clone https://github.com/microsoft/mindaro.git [local-repo-path]"
  exit 1
fi

installHelmFunction

echo "Setting the Kube context to $AKSNAME in $RGNAME"
az aks get-credentials -g $RGNAME -n $AKSNAME

# Use Helm to deploy a traefik ingress controller
echo "helm repo add && helm repo update"
$HELMDIR/helm repo add stable https://charts.helm.sh/stable
$HELMDIR/helm repo update

echo ""
echo "helm install traefik ingress controller in $BIKENS $HELMARGS"
$HELMDIR/helm install "$INGRESSNAME-$BIKENS" stable/traefik \
   --namespace $BIKENS --create-namespace \
   --set kubernetes.ingressClass=traefik \
   --set fullnameOverride=$INGRESSNAME \
   --set rbac.enabled=true \
   --set kubernetes.ingressEndpoint.useDefaultPublishedService=true \
   --version 1.85.0 $HELMARGS

echo ""
echo "Waiting for BikeSharing ingress Public IP to be assigned..."
while [ -z "$PUBLICIP" ]; do
  sleep 5
  PUBLICIP=$(kubectl get svc -n $BIKENS $INGRESSNAME -o jsonpath={.status.loadBalancer.ingress[0].ip})
done
echo ""
echo "BikeSharing ingress Public IP: " $PUBLICIP

NIPIOFQDN=$PUBLICIP.nip.io
echo "The Nip.IO FQDN would be " $NIPIOFQDN
 
CHARTDIR="$REPOROOT/samples/BikeSharingApp/charts/"
echo "---"
echo "Chart directory: $CHARTDIR"



echo "helm install bikesharingapp (average time to install = 4 minutes)"
$HELMDIR/helm install bikesharingapp "$CHARTDIR" \
   --set bikesharingweb.ingress.hosts={$BIKENS.bikesharingweb.$NIPIOFQDN} \
   --set gateway.ingress.hosts={$BIKENS.gateway.$NIPIOFQDN} \
   --set bikesharingweb.ingress.annotations."kubernetes\.io/ingress\.class"=traefik \
   --set gateway.ingress.annotations."kubernetes\.io/ingress\.class"=traefik \
   --dependency-update \
   --namespace $BIKENS \
   --timeout 9m \
   --atomic $HELMARGS

echo ""
echo "To try out the app, open the url:"
kubectl -n $BIKENS get ing bikesharingweb -o jsonpath='{.spec.rules[0].host}'
echo ""

