class Expense < ApplicationRecord
  belongs_to :category

  validate :date_cannot_be_in_the_future

  private

  def date_cannot_be_in_the_future
    return if date.blank? || date <= current_local_date

    errors.add(:date, "cannot be in the future")
  end

  def current_local_date
    Time.now.in_time_zone(ENV.fetch("APP_TIME_ZONE", "Asia/Manila")).to_date
  end
end
