# Stage 1: Build React UI
FROM node:22-alpine AS ui-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build .NET Backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /app
COPY backend/src/Platzwart/Platzwart.csproj backend/src/Platzwart/
RUN dotnet restore backend/src/Platzwart/Platzwart.csproj
COPY backend/ backend/
COPY --from=ui-build /app/backend/src/Platzwart/wwwroot backend/src/Platzwart/wwwroot/
RUN dotnet publish backend/src/Platzwart/Platzwart.csproj -c Release -o /out

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
COPY --from=api-build /out ./
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Platzwart.dll"]
