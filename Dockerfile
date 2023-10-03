FROM 416670754337.dkr.ecr.eu-west-2.amazonaws.com/local/configure-local-ssh
FROM 416670754337.dkr.ecr.eu-west-2.amazonaws.com/ci-node-runtime-18

COPY --from=0 ./ ./

RUN dnf install -y tar

WORKDIR /opt

COPY . .

CMD [ "./docker_start.sh" ]

EXPOSE 3000
