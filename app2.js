const AWS = require('aws-sdk');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');

module.exports.handler = async (event) => { 

    const body = JSON.parse(event.body);
    const username = body.Username;
    const password = body.Password;

    const region = 'us-east-1';
    const identityPoolId = process.env.IdentityPoolId; // Your identity pool id here
    const jamaradProviderName = 'jamarad'; // The name of your Federated Identity provider
    const jamaradClientId = process.env.JamaradClientId; // The client id for your Federated Identity provider
    const jamaradRedirectUri = 'https://example.com/callback'; // The redirect uri for your Federated Identity provider
    
    const cognitoIdentity = new AWS.CognitoIdentity();
    
    async function login() {
        return new Promise((resolve, reject) => {
            cognitoIdentity.getId({
                IdentityPoolId: identityPoolId,
                Logins: {
                    [jamaradProviderName]: `CognitoIdentityServiceProvider.${jamaradClientId}@${jamaradRedirectUri}`
                }
            }, (err, data) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    console.log('identity id', data.IdentityId);
                    const params = {
                        IdentityId: data.IdentityId,
                        Logins: {
                            [jamaradProviderName]: `CognitoIdentityServiceProvider.${jamaradClientId}@${jamaradRedirectUri}`
                        }
                    };
                    cognitoIdentity.getCredentialsForIdentity(params, (err, data) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else {
                            const accessKeyId = data.Credentials.AccessKeyId;
                            const secretAccessKey = data.Credentials.SecretKey;
                            const sessionToken = data.Credentials.SessionToken;
                            const expiration = data.Credentials.Expiration;

                            const credentials = new AWS.Credentials({
                                accessKeyId: accessKeyId,
                                secretAccessKey: secretAccessKey,
                                sessionToken: sessionToken
                            });
                            AWS.config.update({
                                region: region,
                                credentials: credentials
                            });

                            const sts = new AWS.STS();
                            sts.getCallerIdentity({}, (err, data) => {
                                if (err) {
                                    console.log(err);
                                    reject(err);
                                } else {
                                    console.log('caller identity', data);
                                    const response = {
                                        statusCode: 200,
                                        body: JSON.stringify({message: "Authentication successful"})
                                    };
                                    resolve(response);
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    const response = await login();
    return response;
};
