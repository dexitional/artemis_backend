# Authentication Microservice

 // FRONTEND
 - Angular passeses credentials for JWT Token from Node.js Auth service.
 - JWT is stored in browser sessionStorage or LocalStorage ( as SSO_UCC_TOKEN key ) for universal use by Angular Apps.
 - Logout in Angular App or Apps calls logout api endpoint or route in Node.js Auth Service ( this destroys JWT Session or set accessToken to NULL in identity.user tbl)
 - Angular service to check idleness and trigger logout api endpoint.

 // BACKEND
 - Node.js Auth service generates JWT and stores against user's access_token field in identity.user tbl
 - Access Token validated by PHP or Node.js services to ensure that JWT passed by frontend are same as access_token in tbl.
 - PHP and Node.js Middleware validates JWT
  