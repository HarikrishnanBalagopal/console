# Wisdom for Openshift Console

## Steps

1. Deploy the Helm chart in the `helm-chart-for-wisdom` directory after editting the `values.yaml` to add your Wisdom backends.

2. Login to the Openshift cluster and do `make deploy-image` to deploy the custom Openshift Console image to the cluster.

## Optional: Steps for Deploying Manually

Follow the steps given in the `README.md` to deploy a custom Openshift Console image. The relevant steps have been repeated below for convenience.

### Deploying a Custom Image to an OpenShift Cluster

1. Put the console operator in unmanaged state:
    ```
    oc patch consoles.operator.openshift.io cluster --patch '{ "spec": { "managementState": "Unmanaged" } }' --type=merge
    ```

2. Update the console Deployment with the new image.
    > **_NOTE:_** (USE THE CUSTOM IMAGE GIVEN IN THE MAKEFILE)
    ```
    oc set image deploy console console=quay.io/myaccount/console:latest -n openshift-console
    ```

3. Wait for the changes to rollout:
    ```
    oc rollout status -w deploy/console -n openshift-console
    ```

You should now be able to see your development changes on the remote OpenShift cluster!

### Removing the Custom Image

1. When done, you can put the console operator back in a managed state to remove the custom image:
    ```
    oc patch consoles.operator.openshift.io cluster --patch '{ "spec": { "managementState": "Managed" } }' --type=merge
    ```
