import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    numericMatchId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    teamA: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    teamB: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    overs: {
      type: Number,
      required: true,
    },
    matchType: {
      type: String,
      required: true,
    },
    tossWinnerTeamId: String,
    tossDecision: String,
    currentInningsIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['setup', 'live', 'completed'],
      default: 'setup',
    },
    innings: {
      type: Array,
      default: [],
    },
    winnerTeamId: String,
    winMargin: String,
    playerOfTheMatchId: String,
    review: mongoose.Schema.Types.Mixed,
    auditLog: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const MatchModel = mongoose.model('Match', matchSchema);

export default MatchModel;
