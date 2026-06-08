
/**
 * globals is used to keep track of variables (data structures and methods) that might be needed across the application but cannot be fulfilled using react store
 * variables stored on react store cause re-render of components they are used in and cannot be used outside react environment
 * variables stored on globals will NOT cause re-render of components/methods/functions they are used in
 */

type GlobalKeysTypes =
  | "refreshWebsite"
  | "loggedInSellerId"
  | "parentAdminId"
  | "loggedInSellerName"
  | "reactivationRequested";

type GlobalStateType = {
  refreshWebsite?: () => Promise<void>;
  loggedInSellerId?: string;
  parentAdminId?: string;
  loggedInSellerName?: string;
  reactivationRequested?: boolean;
};

type SetFunction = {
  <K extends GlobalKeysTypes>(key: K, value: GlobalStateType[K]): void;
};

type GetFunction = {
  <K extends GlobalKeysTypes>(key: K): GlobalStateType[K];
};

type GlobalKeysObjType = {
  refreshWebsite: "refreshWebsite";
  loggedInSellerId: "loggedInSellerId";
  parentAdminId: "parentAdminId"; // admin id who have logged in as seller
  loggedInSellerName: "loggedInSellerName";
  reactivationRequested: "reactivationRequested";
};

const state: GlobalStateType = {};

export const keys: GlobalKeysObjType = {
  refreshWebsite: "refreshWebsite",
  loggedInSellerId: "loggedInSellerId",
  parentAdminId: "parentAdminId",
  loggedInSellerName: "loggedInSellerName",
  reactivationRequested: "reactivationRequested",
};

export const set: SetFunction = (key, value) => (state[key] = value);
export const get: GetFunction = (key) => state[key];
