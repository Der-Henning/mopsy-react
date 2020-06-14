"use strict";

class DomainError extends Error {
  constructor(message) {
    super(message);
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    // This clips the constructor invocation from the stack trace.
    // It's not absolutely essential, but it does make the stack trace a little nicer.
    //  @see Node.js reference (bottom)
    Error.captureStackTrace(this, this.constructor);
  }
}

class ResourceNotFoundError extends DomainError {
  constructor(resource, query) {
    super(`Resource ${resource} was not found.`);
    this.data = { resource, query };
  }
}

class MissingParameterError extends DomainError {
  constructor() {
    super(`Missing Parameter(s).`);
    this.data = {};
  }
}

class AuthenticationError extends DomainError {
  constructor() {
    super(`Authentication failed`);
    this.data = {};
  }
}

class UnauthorizedError extends DomainError {
  constructor() {
    super(`Unauthorized`);
    this.data = {};
  }
}

class SolrBackendError extends DomainError {
  constructor() {
    super(`SOLR backend error`);
    this.data = {};
  }
}

class SolrDocumentDoesntExistError extends DomainError {
  constructor() {
    super(`Document doesn't exist`)
    this.data = {};
  }
}

// I do something like this to wrap errors from other frameworks.
// Correction thanks to @vamsee on Twitter:
// https://twitter.com/lakamsani/status/1035042907890376707
class InternalError extends DomainError {
  constructor(error) {
    super(error.message);
    this.data = { error };
  }
}

const error = (errNum, message, data) => {
  var res = { status: { errNum: errNum, message: message } };
  if (data) res.data = data;
  return res;
};

const success = data => {
  return error(0, "success", data);
};

module.exports = {
  error,
  success,
  ResourceNotFoundError,
  InternalError,
  MissingParameterError,
  AuthenticationError,
  UnauthorizedError,
  SolrBackendError,
  SolrDocumentDoesntExistError
};
