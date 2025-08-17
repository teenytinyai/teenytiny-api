require 'openai'
require 'rspec'

# Configure RSpec
RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
end

# Helper method to create OpenAI client configured for TeenyTiny AI
def create_test_client
  base_url = ENV['TEENYTINY_URL'] || 'http://localhost:8080'
  api_key = ENV['TEENYTINY_API_KEY'] || 'testkey'

  OpenAI::Client.new(
    access_token: api_key,
    uri_base: base_url
  )
end