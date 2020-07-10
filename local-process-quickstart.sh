#!/bin/bash

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
   exit 1 # Exit script after printing help
}

installHelmFunction()
{
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
}

cleanupFunction()
{
   echo ""
   echo "Setting the Kube context"
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

while getopts "g:n:r:c" opt; do
   case "$opt" in
      c ) CLEANUP="true"  ;;
      g ) RGNAME="$OPTARG"  ;;
      n ) AKSNAME="$OPTARG"  ;;
      r ) REPOROOT="$OPTARG"  ;;
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

installHelmFunction

echo "Setting the Kube context"
az aks get-credentials -g $RGNAME -n $AKSNAME

echo "Create namespace dev"
kubectl create namespace dev

# Use Helm to deploy a traefik ingress controller
echo "helm repo add && helm repo update"
$HELMDIR/helm repo add stable https://kubernetes-charts.storage.googleapis.com/
$HELMDIR/helm repo update
echo "helm install traefik ingress controller"
$HELMDIR/helm install $INGRESSNAME stable/traefik \
   --namespace dev \
   --set kubernetes.ingressClass=traefik \
   --set fullnameOverride=$INGRESSNAME \
   --set rbac.enabled=true \
   --set kubernetes.ingressEndpoint.useDefaultPublishedService=true \
   --version 1.85.0

while [ -z "$PUBLICIP" ]; do
  sleep 5
  PUBLICIP=$(kubectl get svc -n dev $INGRESSNAME -o jsonpath={.status.loadBalancer.ingress[0].ip})
done

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
   --atomic

echo ""
echo "To try out the app, open the url:"
kubectl -n dev get ing bikesharingweb -o jsonpath='{.spec.rules[0].host}'
echo ""
