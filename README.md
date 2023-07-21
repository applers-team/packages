# Applers Packages

## Yarn setup

First retrieve a personal access token from Gitlab:
1. https://gitlab.com/-/profile/personal_access_tokens
2. Name your token name arbitrarily
3. set an expiration date (default and max is 365 days)
4. select the `api` scope in order to be able to publish manually and to fetch packages from the repository

### Yarn v1 (classic)

For yarn 1 we need 2 files in our user folder `~/.npmrc` and `~/.yarnrc`.
- `.yarnrc` => set up the registry for the scope
- `.npmrc` => set up the auth token for the registry (yarn 1 accesses the auth token in `.npmrc` file)

`~/.yarnrc`
```
"@applers:registry" "https://gitlab.com/api/v4/projects/47840319/packages/npm/"
```

`~/.npmrc`
```
//gitlab.com/api/v4/projects/47840319/packages/npm/:_authToken="<your access token goes here>"
```

### Yarn v2+

For newer yarn versions we can configure everything in one place. We only require the global `~/.yarnrc.yml` in the user folder.

Paste the following configuration for an ["instance-level" setup](https://docs.gitlab.com/ee/user/packages/yarn_repository/#install-from-the-instance-level):
```
npmScopes:
  applers:
    npmPublishRegistry: 'https://gitlab.com/api/v4/projects/47840319/packages/npm'
    npmRegistryServer: 'https://gitlab.com/api/v4/packages/npm'
    npmAlwaysAuth: true
    npmAuthToken: '<your access token goes here>'

npmRegistries:
    //gitlab.com/api/v4/packages/npm:
      npmAlwaysAuth: true
      npmAuthToken: '<your access token goes here>'
```
