require 'rails_helper'

RSpec.describe Expense, type: :model do
  let(:category) { Category.create!(name: "Food") }
  let(:local_today) { Time.now.in_time_zone(ENV.fetch("APP_TIME_ZONE", "Asia/Manila")).to_date }

  it "allows today's date" do
    expense = Expense.new(
      description: "Lunch",
      amount: 100,
      category: category,
      date: local_today
    )

    expect(expense).to be_valid
  end

  it "allows past dates" do
    expense = Expense.new(
      description: "Lunch",
      amount: 100,
      category: category,
      date: local_today - 1.day
    )

    expect(expense).to be_valid
  end

  it "rejects future dates" do
    expense = Expense.new(
      description: "Lunch",
      amount: 100,
      category: category,
      date: local_today + 1.day
    )

    expect(expense).not_to be_valid
    expect(expense.errors[:date]).to include("cannot be in the future")
  end
end
