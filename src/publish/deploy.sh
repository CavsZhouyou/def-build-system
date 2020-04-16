
        #!/bin/bash
        docker build --network=host -t 192.168.3.61:5000/taobao-fe/def-deploy-demo:0.0.1 src/publish/.
        docker push 192.168.3.61:5000/taobao-fe/def-deploy-demo:0.0.1 
        docker stop def-deploy-demo
        docker images | grep none | awk '{print $3}' | xargs docker rmi
        