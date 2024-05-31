const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');

module.exports.handler = async (event) => {
    const body = JSON.parse(event.body);
    const username = body.Username;
    const password = body.Password;

    const poolData = {
        UserPoolId: process.env.UserPoolId, // Your user pool id here    
        ClientId: process.env.ClientId // Your client id here
    };

    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    let statusCode = 200;
    let resp = "";

    try {
        const accessToken = await Login(username, password, userPool);
        statusCode = 200;
        resp = { message: "Authentication successful", Details: accessToken }

    } catch (error) {
        if(error.code === 'NotAuthorizedException') {
            statusCode = 401;
            resp = { message: "Not Authorized: Username or Password incorrect" }
        } else {
            statusCode = 500;
            resp = { message: error.name }
        }
    }

    const response = {
        statusCode,
        body: JSON.stringify(resp)

    };
    return response;
};

async function Login(username, password, userPool) {
    return new Promise((resolve, reject) => {
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: username,
            Password: password,
        });

        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                var accessToken = result.getAccessToken().getJwtToken();
                const payload = jwt.decode(result.getAccessToken().getJwtToken());
                console.log(payload.exp);

                resolve({ token: accessToken, date_experite: payload.exp });
            },
            onFailure: function (err) {
                console.log('error', JSON.stringify(err));
                reject(err);
            },
        });
    });
}