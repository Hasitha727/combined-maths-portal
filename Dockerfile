# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build ASP.NET Core Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src
COPY CombinedMaths.Api/CombinedMaths.Api.csproj CombinedMaths.Api/
RUN dotnet restore CombinedMaths.Api/CombinedMaths.Api.csproj
COPY CombinedMaths.Api/ CombinedMaths.Api/
WORKDIR /src/CombinedMaths.Api
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Final Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/dist ./wwwroot

# Ensure uploads directories exist
RUN mkdir -p wwwroot/uploads/submissions wwwroot/uploads/papers

ENV ASPNETCORE_URLS=http://+:8080
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "CombinedMaths.Api.dll"]

