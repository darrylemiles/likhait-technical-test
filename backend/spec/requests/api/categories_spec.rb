require 'rails_helper'

RSpec.describe "Api::Categories", type: :request do
  describe "GET /api/categories" do
    let(:suffix) { SecureRandom.hex(4) }
    let!(:alpha) { Category.create!(name: "A-#{suffix}") }
    let!(:middle) { Category.create!(name: "M-#{suffix}") }
    let!(:omega) { Category.create!(name: "Z-#{suffix}") }

    it "returns all categories" do
      get "/api/categories"

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.map { |c| c["name"] }).to include(alpha.name, middle.name, omega.name)
    end

    it "returns categories in alphabetical order" do
      get "/api/categories"

      json = JSON.parse(response.body)
      target_names = json
        .map { |category| category["name"] }
        .select { |name| [ alpha.name, middle.name, omega.name ].include?(name) }

      expect(target_names).to eq([ alpha.name, middle.name, omega.name ])
    end
  end

  describe "POST /api/categories" do
    it "creates a new category" do
      category_name = "Utilities-#{SecureRandom.hex(4)}"
      post "/api/categories", params: { category: { name: category_name } }, as: :json

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq(category_name)
      expect(Category.exists?(name: category_name)).to be(true)
    end

    it "trims surrounding whitespace from category names" do
      category_name = "Travel-#{SecureRandom.hex(4)}"
      post "/api/categories", params: { category: { name: "  #{category_name}  " } }, as: :json

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq(category_name)
    end

    it "returns validation errors for duplicate names ignoring case" do
      category_name = "Food-#{SecureRandom.hex(4)}"
      Category.create!(name: category_name)

      post "/api/categories", params: { category: { name: " #{category_name.downcase} " } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).not_to be_empty
    end

    it "returns validation errors for blank names" do
      post "/api/categories", params: { category: { name: "   " } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).not_to be_empty
    end
  end

  describe "DELETE /api/categories/:id" do
    it "deletes a category and dependent expenses" do
      category = Category.create!(name: "Subscriptions")
      Expense.create!(
        description: "Music",
        amount: 12.34,
        category: category,
        date: Date.current
      )

      expect do
        delete "/api/categories/#{category.id}", as: :json
      end.to change(Category, :count).by(-1)
        .and change(Expense, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
