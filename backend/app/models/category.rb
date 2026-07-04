class Category < ApplicationRecord
  has_many :expenses, dependent: :destroy

  before_validation :normalize_name

  validates :name, presence: true, uniqueness: { case_sensitive: false }

  private

  def normalize_name
    self.name = name.to_s.strip
  end
end
