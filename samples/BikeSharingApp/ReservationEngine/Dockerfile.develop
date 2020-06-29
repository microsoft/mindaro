FROM microsoft/dotnet:2.1-sdk
ARG BUILD_CONFIGURATION=Debug
ENV ASPNETCORE_ENVIRONMENT=Development
ENV DOTNET_USE_POLLING_FILE_WATCHER=true
EXPOSE 80

WORKDIR /src
COPY ["app.csproj", "./"]
RUN dotnet restore "app.csproj"
COPY . .
RUN dotnet build --no-restore -c $BUILD_CONFIGURATION

RUN echo "exec dotnet run --no-build --no-launch-profile -c $BUILD_CONFIGURATION -- \"\$@\"" > /entrypoint.sh

ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]