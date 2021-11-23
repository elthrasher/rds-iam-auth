class Signer {
  getAuthToken = (): string => 'fake_token';
}

const RDS = {
  Signer,
};

export default RDS;
