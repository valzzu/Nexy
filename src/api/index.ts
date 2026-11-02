/**
 * API requests
 * Export all API requests from here
 */

import { request } from '../services/request';

import authRequest from './auth';
import friendRequest from './friend';
import groupRequest from './group';
import instanceRequest from './instance';
import notificationRequest from './notification';
import playerModerationRequest from './playerModeration';
import queryRequest from './queryRequest';
import userRequest from './user';
import worldRequest from './world';
import marketplaceRequest from './marketplace';

window.request = {
    request,
    userRequest,
    worldRequest,
    instanceRequest,
    friendRequest,
    notificationRequest,
    playerModerationRequest,
    authRequest,
    groupRequest,
    queryRequest,
    marketplaceRequest
};

export {
    request,
    userRequest,
    worldRequest,
    instanceRequest,
    friendRequest,
    notificationRequest,
    playerModerationRequest,
    authRequest,
    groupRequest,
    queryRequest,
    marketplaceRequest
};
