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
DISABLETTY=false

echo ""
echo "Migrate assets of Azure Dev Spaces to Bridge to Kubernetes"
echo "----------------------------------------------------------"
echo ""

helpFunction()
{
   echo ""
   echo "Usage: migrate-devspaces-assets.sh -g ResourceGroupName -n AKSName -h ContainerRegistryName"
   echo ""
   echo -e "\t-g Name of resource group of AKS Cluster [required]"
   echo -e "\t-n Name of AKS Cluster [required]"
   echo -e "\t-h Container registry name. Examples: ACR, Docker [required]"
   echo -e "\t-k Kubernetes namespace to deploy resources (uses 'default' otherwise)"
   echo -e "\t-r Path to root of the project that needs to be migrated (default = pwd)"
   echo -e "\t-t Image name & tag in format 'name:tag' (default = 'projectName:stable')"
   echo -e "\t-i Enable a public endpoint to access your service over internet. (default = false)"
   echo -e "\t-y Doesn't prompt for non-tty terminals"
   echo -e "\t-d Helm Debug switch"
   exit 0 # Exit script after printing help
}

installHelmFunction()
{
  if [ ! -d "$HELMDIR" ] || [ ! -f "$HELMDIR/helm" ]; then
    echo "Creating directory for helm"
    mkdir -p $HELMDIR
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
       curl -fsSL -o $HELMDIR/helm.tar.gz https://get.helm.sh/helm-v3.2.1-linux-amd64.tar.gz
       gunzip -c $HELMDIR/helm.tar.gz | tar xopf - -C $HELMDIR
       mv $HELMDIR/linux-amd64/helm $HELMDIR
    elif [[ "$OSTYPE" == "darwin"* ]]; then
       curl -fsSL -o $HELMDIR/helm.tar.gz https://get.helm.sh/helm-v3.2.1-darwin-amd64.tar.gz
       gunzip -c $HELMDIR/helm.tar.gz | tar xopf - -C $HELMDIR
       mv $HELMDIR/darwin-amd64/helm $HELMDIR
    else
       echo "OS not recognized. Please either run on linux-gnu or OSX"
       exit 1
    fi
  fi
}

while getopts "g:n:r:k:h:t:dyi" opt; do
   case "$opt" in
      g ) RGNAME="$OPTARG"  ;;
      n ) AKSNAME="$OPTARG"  ;;
      r ) PROJECTROOT="$OPTARG"  ;;
      d ) HELMARGS=" --debug" ;;
      k ) NAMESPACE="$OPTARG" ;;
      h ) CONTAINERREGISTRY="$OPTARG" ;;
      t ) IMAGENAMEANDTAG="$OPTARG" ;;
      i ) ENABLEINGRESS="true" ;;
      y ) DISABLETTY="true" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

# Print helpFunction in case parameters are empty
if [ -z "$RGNAME" ] || [ -z "$AKSNAME" ] || [ -z "$CONTAINERREGISTRY" ]; then
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
echo "Using project root: '$PROJECTROOT'"

echo "Checking directory $PROJECTROOT for 'azds.yaml', 'Dockerfile.develop' & 'charts' folder"
if [ ! -f "$PROJECTROOT/azds.yaml" ] || [ ! -f "$PROJECTROOT/Dockerfile.develop" ] || [ ! -d "$PROJECTROOT/charts" ]; then
  echo "$(tput setaf 1)ERROR: '$PROJECTROOT' doesn't seem to be initialized by Azure Dev Spaces. $(tput sgr 0)"
  echo "This tool is to deploy resources that used to be deployed by Azure Dev Spaces."
  echo "'azds.yaml' or 'Dockerfile.develop' or 'charts' folder that were prep'ed by Azure Dev spaces are not found."
  echo "Run 'azds prep' in $PROJECTROOT and try to run this tool again."
  exit 1
fi

echo "Directory $PROJECTROOT is initialized for Azure Dev Spaces."
echo "Migrating assets..."

PROJECTNAME=$(basename $PROJECTROOT)
if [ -z "$IMAGENAMEANDTAG" ]; then
   IMAGENAMEANDTAG="$PROJECTNAME:stable"
fi
IMAGENAMEANDTAG=$(echo $IMAGENAMEANDTAG | tr [:upper:] [:lower:])

{
   installHelmFunction
} || {
   echo "Please install helm at location: '$HELMDIR' by following instruction here: 'https://helm.sh/docs/intro/install/'."
   exit 1
}

if [[ "$DISABLETTY" == "false" ]]; then
   echo "Are logged in or able to push images to '$CONTAINERREGISTRY' container registry? (Y/n): "
   read RESPONSE
   RESPONSE=$(echo $RESPONSE | tr '[:upper:]' '[:lower:]')
   if [ "$RESPONSE" != "y" ]; then
      echo "Please log in or make sure that you can push images to '$CONTAINERREGISTRY' container registry."
      exit 1
   fi
else
   echo "Please log in or make sure that you can push images to '$CONTAINERREGISTRY' container registry."
fi

echo "docker build - '$PROJECTNAME'"
docker build -f "$PROJECTROOT/Dockerfile.develop" -t "$CONTAINERREGISTRY/$IMAGENAMEANDTAG" "$PROJECTROOT"
echo
echo "Pushing image: $CONTAINERREGISTRY/$IMAGENAMEANDTAG"
docker push "$CONTAINERREGISTRY/$IMAGENAMEANDTAG"

echo "Updating the image name in $PROJECTROOT/charts/$PROJECTNAME/values.yaml file:"
IFS=':' read -ra IMAGENAMEARRAY <<< "$CONTAINERREGISTRY/$IMAGENAMEANDTAG"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
   sed -i "s^repository:.*^repository: ${IMAGENAMEARRAY[0]}^g" "$PROJECTROOT/charts/$PROJECTNAME/values.yaml"
   sed -i "s^tag:.*^tag: ${IMAGENAMEARRAY[1]}^g" "$PROJECTROOT/charts/$PROJECTNAME/values.yaml"
elif [[ "$OSTYPE" == "darwin"* ]]; then
   sed -i '' "s^repository:.*^repository: ${IMAGENAMEARRAY[0]}^g" "$PROJECTROOT/charts/$PROJECTNAME/values.yaml"
   sed -i '' "s^tag:.*^tag: ${IMAGENAMEARRAY[1]}^g" "$PROJECTROOT/charts/$PROJECTNAME/values.yaml"
fi

echo "Setting the Kube context to $AKSNAME in $RGNAME"
az aks get-credentials -g $RGNAME -n $AKSNAME

if [[ $ENABLEINGRESS == "true" ]]; then
   # Use Helm to deploy a traefik ingress controller
   echo "helm repo add && helm repo update"
   $HELMDIR/helm repo add stable https://kubernetes-charts.storage.googleapis.com/
   $HELMDIR/helm repo update

   echo ""
   echo "helm upgrade traefik ingress controller in '$NAMESPACE' with args: $HELMARGS"
   $HELMDIR/helm upgrade "$INGRESSNAME-$NAMESPACE" stable/traefik \
      --namespace $NAMESPACE --create-namespace \
      --set kubernetes.ingressClass=traefik \
      --set fullnameOverride=$INGRESSNAME \
      --set rbac.enabled=true \
      --set kubernetes.ingressEndpoint.useDefaultPublishedService=true \
      --install \
      --version 1.85.0 $HELMARGS

   echo ""
   RUNLOOPFOR=$(( $SECONDS + 300 ))
   while [ -z "$PUBLICIP" ] && [ $SECONDS -lt $RUNLOOPFOR ]; do
      echo "Waiting for the Public IP to be assigned to load balancer..."
      sleep 5
      PUBLICIP=$(kubectl get svc -n $NAMESPACE $INGRESSNAME -o jsonpath={.status.loadBalancer.ingress[0].ip})
   done

   if [ -z "$PUBLICIP" ]; then
      echo "Failed to get public IP."
      exit 1
   fi

   echo ""
   echo "Load Balancer's Public IP: " $PUBLICIP
fi
 
CHARTDIR="$PROJECTROOT/charts/$PROJECTNAME"
echo "---"
echo "Chart directory: $CHARTDIR"

echo "helm upgrade $PROJECTNAME"
$HELMDIR/helm upgrade $PROJECTNAME "$CHARTDIR" \
   --set ingress.hosts={"$NAMESPACE.$PROJECTNAME.$PUBLICIP.nip.io"} \
   --set ingress.enabled="$ENABLEINGRESS" \
   --set ingress.annotations."kubernetes\.io/ingress\.class"=traefik \
   --namespace $NAMESPACE \
   --create-namespace \
   --timeout 9m \
   --install \
   --force \
   --atomic $HELMARGS

echo ""
if [[ $ENABLEINGRESS == "true" ]]; then
   echo "To try out the app, open the url:"
   kubectl -n $NAMESPACE get ing $PROJECTNAME -o jsonpath='{.spec.rules[0].host}'
   echo ""
fi

echo "Migration complete."

