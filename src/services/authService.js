import api from './api';

export const googleLoginService = {
  login: (idToken) =>
    api.post('/authentication/login/google/', { token: idToken }),
};
