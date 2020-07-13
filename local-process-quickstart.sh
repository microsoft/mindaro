#!/bin/bash
set -e

# Please install the below pre-requisites if using this on your local machine, or alternately, you can just use azure bash cloudshell for a seamless experience.
#1. azure cli    :   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest
#2. kubectl      :   https://kubernetes.io/docs/tasks/tools/install-kubectl/
#3. curl
#4. gunzip
#5. tar

HELMDIR=/var/tmp/helm_lpk
INGRESSNAME=bikesharing-traefik

helpFunction()
{
   echo ""
   echo "Usage: $1 -g ResourceGroupName -n AKSName"
   echo -e "\t-g Name of resource group of AKS Cluster"
   echo -e "\t-n Name of AKS Cluster"
   echo -e "\t-r Path to Root of the git repo"
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
   $HELMDIR/helm --namespace dev uninstall bikesharingapp
   $HELMDIR/helm --namespace dev uninstall $INGRESSNAME
   echo "Delete namespace dev? (Y/n) : "
   read RESPONSE
   if [ "$RESPONSE" == "y" ] || [ "$RESPONSE" == "Y" ]; then
      kubectl delete namespace dev
   fi
   rm -rf $HELMDIR
   exit 0
}

while getopts "g:n:r:cd" opt; do
   case "$opt" in
      c ) CLEANUP="true"  ;;
      g ) RGNAME="$OPTARG"  ;;
      n ) AKSNAME="$OPTARG"  ;;
      r ) REPOROOT="$OPTARG"  ;;
      d ) HELMARGS=" --debug" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

# Print helpFunction in case parameters are empty
if [ ! -z "$CLEANUP" ]; then
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
   echo "Defaulting Git repository root to current directory : $PWD"
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

#echo "Create namespace dev"
#kubectl create namespace dev

# Use Helm to deploy a traefik ingress controller
echo "helm repo add && helm repo update"
$HELMDIR/helm repo add stable https://kubernetes-charts.storage.googleapis.com/
$HELMDIR/helm repo update
echo "helm install traefik ingress controller $HELMARGS"
$HELMDIR/helm install $INGRESSNAME stable/traefik \
   --namespace dev --create-namespace \
   --set kubernetes.ingressClass=traefik \
   --set fullnameOverride=$INGRESSNAME \
   --set rbac.enabled=true \
   --set kubernetes.ingressEndpoint.useDefaultPublishedService=true \
   --version 1.85.0 $HELMARGS

echo "Waiting for BikeSharing ingress Public IP to be assigned..."
while [ -z "$PUBLICIP" ]; do
  sleep 5
  PUBLICIP=$(kubectl get svc -n dev $INGRESSNAME -o jsonpath={.status.loadBalancer.ingress[0].ip})
done
echo ""
echo "BikeSharing ingress Public IP: " $PUBLICIP

NIPIOFQDN=$PUBLICIP.nip.io
echo "The Nip.IO FQDN would be " $NIPIOFQDN
 
CHARTDIR="$REPOROOT/samples/BikeSharingApp/charts/"
echo "---"
echo "Chart directory: $CHARTDIR"

echo "helm install bikesharingapp"
$HELMDIR/helm install bikesharingapp "$CHARTDIR" \
   --set bikesharingweb.ingress.hosts={dev.bikesharingweb.$NIPIOFQDN} \
   --set gateway.ingress.hosts={dev.gateway.$NIPIOFQDN} \
   --set bikesharingweb.ingress.annotations."kubernetes\.io/ingress\.class"="traefik" \
   --set gateway.ingress.annotations."kubernetes\.io/ingress\.class"="traefik" \
   --dependency-update \
   --namespace dev \
   --atomic $HELMARGS

echo ""
echo "To try out the app, open the url:"
kubectl -n dev get ing bikesharingweb -o jsonpath='{.spec.rules[0].host}'
echo ""

