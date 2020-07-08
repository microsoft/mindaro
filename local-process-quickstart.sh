#!/bin/bash

# Please install the below pre-requisites if using this on your local machine, or alternately, you can just use azure bash cloudshell for a seamless experience.
#1. azure cli    :   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest
#2. kubectl      :   https://kubernetes.io/docs/tasks/tools/install-kubectl/
#3. curl
#4. gunzip
#5. tar

INGRESSNAME=bikesharing-traefik
PIPNAME=BikeSharingPip
HELMDIR=/var/tmp/helm_azds
HELMROOT=${HELMDIR}/darwin-amd64

helpFunction()
{
   echo ""
   echo "Usage: $1 -g ResourceGroupName -n AKSName -r DevSpacesRepoRoot"
   echo -e "\t-g Name of resource group of AKS Cluster"
   echo -e "\t-n Name of AKS Cluster"
   echo -e "\t-r Path to Root of dev spaces repo"
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
   fi
}

cleanupFunction()
{
   echo ""
   echo "Setting the Kube context"
   az aks get-credentials -g $RGNAME -n $AKSNAME
   ${HELMDIR}/helm --namespace dev uninstall bikesharingapp
   ${HELMDIR}/helm --namespace $INGRESSNAME uninstall $INGRESSNAME
   echo "Delete namespace dev? (Y/n) : "
   read RESPONSE
   if [ "${RESPONSE}" == "y" ] || [ "${RESPONSE}" == "Y" ]
   then
      kubectl delete namespace dev
   fi
   kubectl delete ns $INGRESSNAME
   rm -rf $HELMDIR
   SUB=$(az account show --query id -o tsv)
   SPID=$(az aks show -n ${AKSNAME} -g ${RGNAME} --query servicePrincipalProfile.clientId -o tsv)
   if [[ "${SPID}" == "msi" ]]; then
      # Managed identity cluster
      SPID=$(az aks show -n ${AKSNAME} -g ${RGNAME} --query identity.principalId -o tsv)
   fi
   az role assignment delete --assignee ${SPID} --scope "/subscriptions/${SUB}/resourceGroups/${RGNAME}" --role "Network Contributor"
   az network public-ip delete --name $PIPNAME --resource-group $RGNAME
   if [ $? -eq 1 ]
   then
      echo "Please delete the Public IP address ${PIPNAME} in resource group ${RGNAME} manually"
   fi
   exit 1
}

while getopts "g:n:r:c" opt
do
   case "$opt" in
      c ) CLEANUP="true"  ;;
      g ) RGNAME="$OPTARG"  ;;
      n ) AKSNAME="$OPTARG"  ;;
      r ) REPOROOT="$OPTARG"  ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

# Print helpFunction in case parameters are empty
if [ ! -z "$CLEANUP" ]
then
   if [ -z "$RGNAME" ]
   then
      echo "Please pass -g when calling -c"
      helpFunction
   else
      cleanupFunction
   fi
elif [ -z "$RGNAME" ] || [ -z "$AKSNAME" ]
then
   echo "Some or all of the parameters are empty";
   helpFunction
fi

if [ -z "$REPOROOT" ]
then
   echo "Defaulting Dev spaces repository root to current directory : ${PWD}"
   REPOROOT=$PWD
fi

installHelmFunction

echo "Setting the Kube context"
az aks get-credentials -g $RGNAME -n $AKSNAME

echo "Applying role assignment"
SUB=$(az account show --query id -o tsv)
SPID=$(az aks show -n ${AKSNAME} -g ${RGNAME} --query servicePrincipalProfile.clientId -o tsv)
if [[ "${SPID}" == "msi" ]]; then
   # Managed identity cluster
   SPID=$(az aks show -n ${AKSNAME} -g ${RGNAME} --query identity.principalId -o tsv)
fi
az role assignment create --assignee ${SPID} --scope "/subscriptions/${SUB}/resourceGroups/${RGNAME}" --role "Network Contributor"

echo "Creating Public IP"
AKSLOCATION=$(az aks show -n ${AKSNAME} -g ${RGNAME} --query location -o tsv)
PUBLICIP=$(az network public-ip create --resource-group $RGNAME --name $PIPNAME --location $AKSLOCATION --sku Standard --allocation-method static --query publicIp.ipAddress -o tsv)
echo "BikeSharing ingress Public IP: " $PUBLICIP
 
echo "Create namespace ${INGRESSNAME}"
kubectl create namespace $INGRESSNAME

# Use Helm to deploy a traefik ingress controller
echo "helm repo add && helm repo update"
${HELMDIR}/helm repo add stable https://kubernetes-charts.storage.googleapis.com/
${HELMDIR}/helm repo update
echo "helm install traefik ingress controller"
${HELMDIR}/helm install $INGRESSNAME stable/traefik \
   --namespace $INGRESSNAME \
   --set kubernetes.ingressClass=traefik \
   --set fullnameOverride=$INGRESSNAME \
   --set rbac.enabled=true \
   --set service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-resource-group"="$RGNAME" \
   --set loadBalancerIP=$PUBLICIP \
   --set kubernetes.ingressEndpoint.useDefaultPublishedService=true \
   --version 1.85.0
 
NIPIOFQDN=${PUBLICIP}.nip.io
echo "The Nip.IO FQDN would be " $NIPIOFQDN
 
CHARTDIR=${REPOROOT}/samples/BikeSharingApp/charts/
echo "---"
echo "Chart directory: $CHARTDIR"
 
echo "Create namespace dev"
kubectl create ns dev

echo "helm install bikesharingapp"
${HELMDIR}/helm install bikesharingapp $CHARTDIR \
                --set bikesharingweb.ingress.hosts={dev.bikesharingweb.${NIPIOFQDN}} \
                --set gateway.ingress.hosts={dev.gateway.${NIPIOFQDN}} \
                --set bikesharingweb.ingress.annotations."kubernetes\.io/ingress\.class"="traefik" \
                --set gateway.ingress.annotations."kubernetes\.io/ingress\.class"="traefik" \
                --dependency-update \
                --namespace dev \
                --atomic \

echo ""
echo "To try out the app, open the url:"
kubectl -n dev get ing bikesharingweb -o jsonpath='{.spec.rules[0].host}'
echo ""
