export const convertParamToBoolean = (
  booleanParam: string | undefined
): boolean => {
  if (typeof booleanParam === 'boolean') {
    return booleanParam;
  }
  if (!booleanParam) {
    return false;
  }
  if (booleanParam.toLowerCase() === 'true') {
    return true;
  } else {
    return false;
  }
};
