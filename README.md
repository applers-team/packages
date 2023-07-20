# Applers Packages

## Yarn setup

First retrieve a personal access token from Gitlab:
1. https://gitlab.com/-/profile/personal_access_tokens
2. Name your token name arbitrarily
3. set an expiration date (default and max is 365 days)
4. select the `api` scope in order to be able to publish manually and to fetch packages from the repository

Then edit your global `.yarnrc.yml` in your user folder => `~/.yarnrc.yml`
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
